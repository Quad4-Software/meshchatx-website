@php
    $page = 'error';
    $status = (int) ($status ?? 500);
@endphp

@extends('layouts.app')

@section('content')
    <x-error-page :status="$status" />
@endsection
